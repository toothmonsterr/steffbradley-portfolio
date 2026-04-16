import {
  PlasmicComponent,
  extractPlasmicQueryData,
  ComponentRenderData,
  PlasmicRootProvider,
} from '@plasmicapp/loader-nextjs';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Error from 'next/error';
import { PLASMIC } from '@/lib/plasmic-init';

interface CatchallProps {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, unknown>;
}

export default function CatchallPage({ plasmicData, queryCache }: CatchallProps) {
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />;
  }

  const pageMeta = plasmicData.entryCompMetas[0];

  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      prefetchedQueryData={queryCache}
    >
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Skip Plasmic fetching when project credentials are not yet configured.
  // Set NEXT_PUBLIC_PLASMIC_PROJECT_ID and NEXT_PUBLIC_PLASMIC_PUBLIC_TOKEN
  // in .env.local, then re-run the build.
  if (!process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID ||
      process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID === 'YOUR_PROJECT_ID') {
    return { paths: [], fallback: 'blocking' };
  }

  const pageModules = await PLASMIC.fetchPages();
  return {
    paths: pageModules.map((mod) => ({
      params: {
        catchall: mod.path.substring(1).split('/').filter(Boolean),
      },
    })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {};
  const plasmicPath = typeof catchall === 'string'
    ? catchall
    : Array.isArray(catchall)
      ? `/${catchall.join('/')}`
      : '/';

  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);

  if (!plasmicData) {
    return { notFound: true };
  }

  // Pre-fetch data for any data-fetching components (e.g. PortfolioGrid)
  const queryCache = await extractPlasmicQueryData(
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={plasmicData}>
      <PlasmicComponent component={plasmicData.entryCompMetas[0].displayName} />
    </PlasmicRootProvider>
  );

  return {
    props: { plasmicData, queryCache },
    revalidate: 60, // ISR: revalidate every 60 seconds
  };
};
