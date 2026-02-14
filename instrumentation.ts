// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and start cron job here
    console.log('[Instrumentation] Server starting...');
    
    // Using a dynamic import to avoid bundling issues if necessary
    const { startScheduler } = await import('@/lib/scheduler');
    startScheduler();
  }
}
