const { UserAction } = require('../models');

module.exports = async (req, res, next) => {
  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    const trackedRoutes = ['/protect/step1', '/protect/step4', '/trademark/check', '/subscribe'];

    if (trackedRoutes.includes(req.path)) {
      const actionData = {
        user_id: req.user?.id || null,
        session_id: req.sessionID,
        path: req.path,
        method: req.method,
        status_code: res.statusCode,
        duration,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        referrer: req.headers.referer || '',
        conversion_type: determineConversionType(req.path, res.statusCode)
      };
      UserAction.create(actionData).catch(e => {
        console.error('Conversion tracking error:', e);
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

function determineConversionType(path, status) {
  if (path === '/subscribe' && status === 200) return 'subscription';
  if (path === '/protect/step4' && status === 200) return 'free_trial_complete';
  if (path === '/trademark/check' && status === 200) return 'trademark_check';
  return 'page_view';
}
