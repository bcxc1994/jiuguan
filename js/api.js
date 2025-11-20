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

// 数据同步功能 - 上传到云端
window.syncToCloud = async () => {
  try {
    // 从localStorage获取本地数据
    const localReports = JSON.parse(localStorage.getItem('reports') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const localConfig = JSON.parse(localStorage.getItem('config') || '{}');

    // 从云端获取最新数据
    const [cloudReports, cloudUsers, cloudConfig] = await Promise.all([
      window.ReportAPI.getAllReports(),
      window.UserAPI.getAllUsers(),
      window.ConfigAPI.getConfig(),
    ]);

    // 将云端数据转换为ID映射，便于比较
    const cloudReportsMap = new Map(cloudReports.map(r => [r.id, r]));
    const cloudUsersMap = new Map(cloudUsers.map(u => [u.id, u]));

    // 准备需要上传的报告
    const reportsToUpload = localReports.filter(localReport => {
      const cloudReport = cloudReportsMap.get(localReport.id);
      // 如果云端没有这个报告，或者本地报告更新时间更晚，则需要上传
      return !cloudReport || new Date(localReport.updatedAt) > new Date(cloudReport.updatedAt);
    });

    // 准备需要上传的用户
    const usersToUpload = localUsers.filter(localUser => {
      const cloudUser = cloudUsersMap.get(localUser.id);
      // 如果云端没有这个用户，或者本地用户更新时间更晚，则需要上传
      return !cloudUser || new Date(localUser.updatedAt) > new Date(cloudUser.updatedAt);
    });

    // 准备需要上传的配置
    const configToUpload = localConfig;
    const uploadConfig = cloudConfig.updatedAt ? new Date(localConfig.updatedAt) > new Date(cloudConfig.updatedAt) : true;

    // 执行上传
    const uploadPromises = [
      ...reportsToUpload.map(report => window.ReportAPI.createReport(report)),
      ...usersToUpload.map(user => window.UserAPI.createUser(user))
    ];

    if (uploadConfig) {
      uploadPromises.push(window.ConfigAPI.updateConfig(configToUpload));
    }

    await Promise.all(uploadPromises);

    // 计算上传的记录总数
    const total = reportsToUpload.length + usersToUpload.length + (uploadConfig ? 1 : 0);
    return { success: true, message: '数据上传成功', total };
  } catch (error) {
    return { success: false, message: `数据上传失败: ${error.message}` };
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