const glados = async () => {
  const cookie = process.env.GLADOS
  if (!cookie) return
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    }
    const checkin = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: '{"token":"glados.one"}',
    }).then((r) => r.json())
    const status = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers,
    }).then((r) => r.json())
    return [
      'Checkin OK',
      ${checkin.message},
      Left Days ${Number(status?.data?.leftDays || 0)},  // 使用可选链和默认值
    ]
  } catch (error) {
    return [
      'Checkin Error',
      ${error},
      ``,
    ]
  }
}
const notify = async (contents) => {
  const token = process.env.NOTIFY
  if (!token || !contents) return
  await fetch(https://www.pushplus.plus/send, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token,
      title: contents[0],
      content: contents.join(''),
      template: 'markdown',
    }),
  })
}
const main = async () => {
  await notify(await glados())
}
main()
