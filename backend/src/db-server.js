const { default: EmbeddedPostgres } = require('embedded-postgres');
const path = require('path');
const fs = require('fs');
const net = require('net');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function startDb() {
  const dbDataDir = path.join(__dirname, '..', 'data', 'pgdata');
  if (!fs.existsSync(dbDataDir)) {
    fs.mkdirSync(dbDataDir, { recursive: true });
  }

  const portActive = await isPortInUse(5432);
  if (portActive) {
    console.log('✅ PostgreSQL is already running on port 5432.');
    // Keep process alive if invoked as long-running server
    await new Promise(() => {});
    return;
  }

  // Remove stale postmaster.pid if postgres is not running
  const pidFile = path.join(dbDataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
      console.log('🧹 Cleaned up stale postmaster.pid');
    } catch (e) {
      console.warn('Note on postmaster.pid:', e.message);
    }
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbDataDir,
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'complygem',
    persistent: true,
  });

  const isInitialized = fs.existsSync(path.join(dbDataDir, 'PG_VERSION'));
  if (!isInitialized) {
    console.log('🔄 Initializing PostgreSQL server on port 5432...');
    await pg.initialise();
  }
  console.log('🚀 Starting PostgreSQL server...');
  await pg.start();
  console.log('✅ PostgreSQL database running on localhost:5432 (database: complygem, user: postgres)');

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
}

startDb().catch((err) => {
  console.error('Failed to start embedded PostgreSQL:', err);
  process.exit(1);
});
