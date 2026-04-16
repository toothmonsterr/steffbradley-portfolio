import React from 'react';
import Tilt from 'react-parallax-tilt';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay/NoiseOverlay';
import styles from './PortfolioGrid.module.css';

export interface PortfolioItem {
  title: string;
  description?: string;
  year?: string | number;
  category?: string;
  thumbnail?: { url: string; alt?: string };
  caseStudyUrl?: string;
  liveUrl?: string;
  overviewUrl?: string;
}

interface PortfolioCardProps {
  item: PortfolioItem;
}

export function PortfolioCard({ item }: PortfolioCardProps) {
  return (
    <Tilt
      tiltMaxAngleX={8}
      tiltMaxAngleY={8}
      perspective={1200}
      scale={1.02}
      glareEnable={false}
      transitionSpeed={400}
    >
      <div className={styles.card}>
        {item.thumbnail?.url && (
          <img
            src={item.thumbnail.url}
            alt={item.thumbnail.alt ?? item.title}
            className={styles.thumbnail}
            loading="lazy"
          />
        )}
        <div className={styles.cardBody}>
          <div className={styles.meta}>
            {item.category && <span className={styles.category}>{item.category}</span>}
            {item.year && <span className={styles.year}>{item.year}</span>}
          </div>
          <h3 className={styles.title}>{item.title}</h3>
          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}
          <div className={styles.links}>
            {item.caseStudyUrl && (
              <a href={item.caseStudyUrl} className={styles.link} target="_blank" rel="noopener noreferrer">
                case study
              </a>
            )}
            {item.liveUrl && (
              <a href={item.liveUrl} className={styles.link} target="_blank" rel="noopener noreferrer">
                live site
              </a>
            )}
            {item.overviewUrl && (
              <a href={item.overviewUrl} className={styles.link} target="_blank" rel="noopener noreferrer">
                overview
              </a>
            )}
          </div>
        </div>
        {/* Risograph texture overlay */}
        <NoiseOverlay opacity={0.08} />
      </div>
    </Tilt>
  );
}
