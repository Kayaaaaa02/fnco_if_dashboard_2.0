/**
 * Team Isolation Middleware
 *
 * Extracts team info from request headers and adds team filtering context.
 * - x-team-code: user's team code
 * - x-user-role: user's role (admin bypasses team isolation)
 *
 * Only applies to /api/v2/campaigns* routes.
 * Admin users (x-user-role: 'admin') bypass team filtering.
 */
export default function teamIsolation(req, res, next) {
  // Only apply to V2 campaign routes
  if (!req.path.startsWith('/api/v2/campaigns')) {
    return next();
  }

  const teamCode = req.headers['x-team-code'];
  const userRole = req.headers['x-user-role'];

  // Admin bypasses team isolation
  if (userRole === 'admin') {
    req.teamCode = null; // null means no filtering
    return next();
  }

  req.teamCode = teamCode || null;
  next();
}
