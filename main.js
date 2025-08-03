const glados = async () => {
  const cookie = process.env.GLADOS;
  if (!cookie) return ['Config Error', 'Missing GLADOS cookie', ''];
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    // 签到请求
    const checkin = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ token: "glados.one" })
    }).then(r => r.json()).catch(e => ({ code: -1, message: e.message }));
    // 状态请求
    const status = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers
    }).then(r => r.json()).catch(e => ({ code: -1, data: {} }));
    return [
      checkin.code === 0 ? 'Checkin OK' : 'Checkin Failed',
      checkin.message || 'No response message',
      Left Days: ${Number(status?.data?.leftDays || 0).toFixed(1)},
      Code: ${checkin.code || status.code || 'N/A'}
    ];
  } catch (error) {
    return [
      'Network Error',
      error.message,
      Retry: ${process.env.GITHUBSERVERURL}/${process.env.GITHUBREPOSITORY}
    ];
  }
};
const notify = async (contents) => {
  if (!contents || !process.env.NOTIFY) return;
  
  await fetch('https://notify-api.example.com/send', {  // 替换为实际通知接口
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: process.env.NOTIFY,
      title: contents[0],
      content: contents.filter(Boolean).join('\n'),
      template: 'html'
    })
  }).catch(e => console.error('Notify failed:', e));
};
// 执行入口
(async () => {
  try {
    await notify(await glados());
  } catch (e) {
    await notify(['Runtime Error', e.message]);
  }
})();
主要改进点：
使用可选链操作符 ?. 安全访问嵌套属性
所有异步操作添加 .catch() 兜底处理
状态数据提供默认值 || 0
错误信息包含更多诊断上下文
通知内容增加空值过滤
使用IIFE包装主逻辑避免全局污染
需要确保环境变量包含：
GLADOS: 网站认证cookie
NOTIFY: 通知服务token
GITHUBSERVERURL/GITHUBREPOSITORY: 错误追踪链接
