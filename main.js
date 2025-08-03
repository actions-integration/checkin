const fetch = require('node-fetch');
require('dotenv').config();
const glados = async () => {
  const cookie = process.env.GLADOS;
  if (!cookie || !cookie.includes('key=')) {
    return ['Config Error', 'Invalid cookie format'];
  }
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36'
    };
    // 签到请求
    const checkin = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: '{"token":"glados.one"}'
    }).then(res => {
      if (!res.ok) throw new Error(HTTP ${res.status});
      return res.json();
    });
    // 状态请求
    const status = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers
    }).then(res => {
      if (!res.ok) throw new Error(HTTP ${res.status});
      return res.json();
    });
    return [
      'Checkin OK',
      checkin.message || '签到成功',
      Left Days ${status?.data?.leftDays ? Math.floor(status.data.leftDays) : '获取失败'}
    ];
  } catch (error) {
    return [
      'Checkin Error',
      error.message || '未知错误',
      ``
    ];
  }
};
const notify = async (contents) => {
  const token = process.env.NOTIFY;
  if (!token || !contents || !Array.isArray(contents)) return;
  try {
    await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        title: contents[0],
        content: contents.join(''),
        template: 'markdown'
      })
    });
  } catch (e) {
    console.error('通知发送失败:', e);
  }
};
const main = async () => {
  await notify(await glados());
};
main();
