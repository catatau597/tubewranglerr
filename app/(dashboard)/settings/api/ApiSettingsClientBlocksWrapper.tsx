import dynamic from 'next/dynamic';

const ApiSettingsClientBlocks = dynamic(() => import('./ApiSettingsClientBlocks'), { ssr: false });

export default function ApiSettingsClientBlocksWrapper() {
  return <ApiSettingsClientBlocks />;
}
