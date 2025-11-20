// API客户端配置
const API_BASE_URL = 'http://localhost:3000/api';

// API请求封装
const apiRequest = async (url, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.statusText}`);
  }
  return response.json();
};

// 用户相关API
window.UserAPI = {
  getAllUsers: () => apiRequest('/users'),
  getUserById: (id) => apiRequest(`/users/${id}`),
  createUser: (user) => apiRequest('/users', 'POST', user),
  updateUser: (id, user) => apiRequest(`/users/${id}`, 'PUT', user),
  deleteUser: (id) => apiRequest(`/users/${id}`, 'DELETE'),
};

// 周报相关API
window.ReportAPI = {
  getAllReports: () => apiRequest('/reports'),
  getReportById: (id) => apiRequest(`/reports/${id}`),
  createReport: (report) => apiRequest('/reports', 'POST', report),
  updateReport: (id, report) => apiRequest(`/reports/${id}`, 'PUT', report),
  deleteReport: (id) => apiRequest(`/reports/${id}`, 'DELETE'),
};

// 配置相关API
window.ConfigAPI = {
  getConfig: () => apiRequest('/config'),
  updateConfig: (config) => apiRequest('/config', 'PUT', config),
};

// 数据同步功能
window.syncToCloud = async () => {
  try {
    // 从localStorage获取数据
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const config = JSON.parse(localStorage.getItem('config') || '{}');

    // 同步到云端
    await Promise.all([
      // 清空云端现有数据（可选，根据需求调整）
      // ...
      // 上传新数据
      ...reports.map(report => window.ReportAPI.createReport(report)),
      ...users.map(user => window.UserAPI.createUser(user)),
      window.ConfigAPI.updateConfig(config),
    ]);

    return { success: true, message: '数据同步成功' };
  } catch (error) {
    return { success: false, message: `数据同步失败: ${error.message}` };
  }
};

// 从云端同步数据
window.syncFromCloud = async () => {
  try {
    // 从云端获取数据
    const [reports, users, config] = await Promise.all([
      window.ReportAPI.getAllReports(),
      window.UserAPI.getAllUsers(),
      window.ConfigAPI.getConfig(),
    ]);

    // 更新localStorage
    localStorage.setItem('reports', JSON.stringify(reports));
    localStorage.setItem('mockUsers', JSON.stringify(users));
    localStorage.setItem('config', JSON.stringify(config));

    return { success: true, message: '数据同步成功' };
  } catch (error) {
    return { success: false, message: `数据同步失败: ${error.message}` };
  }
};