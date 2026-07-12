const simulator = require('./tracking.simulator');

async function getLiveTelemetry(req, res, next) {
  try {
    const snapshot = await simulator.getSnapshot();
    res.json({
      success: true,
      isRunning: simulator.isSimulatorRunning(),
      count: snapshot.length,
      telemetry: snapshot
    });
  } catch (err) {
    next(err);
  }
}

async function toggleSimulator(req, res, next) {
  try {
    const { action } = req.body; // 'start' | 'stop' | 'toggle'
    
    if (action === 'start') {
      simulator.startSimulator();
    } else if (action === 'stop') {
      simulator.stopSimulator();
    } else {
      if (simulator.isSimulatorRunning()) {
        simulator.stopSimulator();
      } else {
        simulator.startSimulator();
      }
    }

    res.json({
      success: true,
      message: `Telemetry simulator is now ${simulator.isSimulatorRunning() ? 'RUNNING (3s interval)' : 'STOPPED'}.`,
      isRunning: simulator.isSimulatorRunning()
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLiveTelemetry,
  toggleSimulator
};
