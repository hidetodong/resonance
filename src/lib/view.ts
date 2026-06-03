/** 顶级视图：卡片列表 / 已解决归档 / 反思统计。 */
export type AppView = 'cards' | 'archive' | 'stats';

/** 视图展示名单一真源（组件不写死中文）。 */
export const APP_VIEWS: { value: AppView; label: string }[] = [
  { value: 'cards', label: '卡片' },
  { value: 'archive', label: '归档' },
  { value: 'stats', label: '统计' },
];
