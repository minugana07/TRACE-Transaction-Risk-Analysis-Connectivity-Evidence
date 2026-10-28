import React, { useEffect, useRef } from 'react';
import { mountTraceInvestigate, InvestigateModule } from '../../modules/investigate';

export const InvestigateModuleView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<InvestigateModule | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (containerRef.current) {
      mountTraceInvestigate(containerRef.current, {
        useSyntheticDemo: false,
      }).then((mod) => {
        if (isCancelled) {
          mod.unmount();
        } else {
          moduleRef.current = mod;
        }
      }).catch((err) => {
        console.error('Failed to mount Investigate Module:', err);
      });
    }

    return () => {
      isCancelled = true;
      if (moduleRef.current) {
        moduleRef.current.unmount();
        moduleRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      <div ref={containerRef} className="w-full min-h-[750px]" />
    </div>
  );
};
