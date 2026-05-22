const ActivityLog = require('../models/activityLog.model');

/**
 * Appends a structured entry to the activity log.
 * Fire-and-forget — never throws; a logging failure must not break the request.
 */
const log = async ({ userId, action, detail, resourceId, resourceType, req }) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      detail,
      resourceId,
      resourceType,
      ip: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    // Structured log to stdout; a monitoring agent can alert on these.
    console.error('[ActivityLog] Failed to write entry:', { action, userId, err: err.message });
  }
};

module.exports = { log };
