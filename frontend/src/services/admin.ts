import { apiConfig } from '@/config/api';
import {
  adminDashboardPresetSchema,
  adminDashboardSchema,
  type AdminDashboardPreset,
} from '@/features/admin/schemas';
import { api } from '@/services/api';

type GetAdminDashboardOptions = {
  preset?: AdminDashboardPreset;
  start?: string;
  end?: string;
};

export async function getAdminDashboard(
  options: GetAdminDashboardOptions = {},
) {
  const preset = adminDashboardPresetSchema.parse(options.preset ?? 'month');
  const response = await api.get(apiConfig.endpoints.admin.dashboard, {
    params: {
      preset,
      start: options.start,
      end: options.end,
    },
  });

  return adminDashboardSchema.parse(response.data);
}
