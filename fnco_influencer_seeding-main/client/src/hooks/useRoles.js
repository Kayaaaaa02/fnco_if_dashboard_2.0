import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// V1 API helper (endpoints are /api/*, not /api/v2/*)
async function v1Request(method, path, { body, params } = {}) {
  const url = new URL(`/api${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => v1Request('GET', '/roles'),
  });
}

export function useRolePermissions(roleId) {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => v1Request('GET', `/roles/${roleId}/permissions`),
    enabled: !!roleId,
  });
}

export function useRoleUsers(roleId) {
  return useQuery({
    queryKey: ['role-users', roleId],
    queryFn: () => v1Request('GET', `/roles/${roleId}/users`),
    enabled: !!roleId,
  });
}

export function useAvailableUsers(excludeRoleId) {
  return useQuery({
    queryKey: ['available-users', excludeRoleId],
    queryFn: () => v1Request('GET', '/users', { params: { excludeRoleId } }),
    enabled: !!excludeRoleId,
  });
}

export function useAddUserToRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData) => v1Request('POST', '/users', { body: userData }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-users', variables.role_id] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
    },
  });
}

export function useRemoveUserFromRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, userId }) => v1Request('DELETE', `/roles/${roleId}/users/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-users', variables.roleId] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
    },
  });
}
