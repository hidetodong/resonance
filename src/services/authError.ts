/** 会话失效信号：数据端点返回 401 时抛出，供上层回退到登录态。 */
export class AuthError extends Error {
  constructor(message = '需要登录') {
    super(message);
    this.name = 'AuthError';
  }
}
