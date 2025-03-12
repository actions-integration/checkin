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
      `${checkin.message}`,
      `Left Days ${Number(status.data.leftDays)}`,
    ]
  } catch (error) {
    return [
      'Checkin Error',
      `${error}`,
      `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`,
    ]
  }
}

const notify = async (contents) => {
  if (!process.env.NOTIFY || !contents) return
  const option = String(process.env.NOTIFY)
  if (option.startsWith('wxpusher:')) {
    await fetch(`https://wxpusher.zjiecode.com/api/send/message`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        appToken: option.split(':')[1],
        summary: contents[0],
        content: contents.join('<br>'),
        contentType: 3,
        uids: option.split(':').slice(2),
      }),
    })
  } else if (option.startsWith('pushplus:')) {
    await fetch(`https://www.pushplus.plus/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: option.split(':')[1],
        title: contents[0],
        content: contents.join('<br>'),
        template: 'markdown',
      }),
    })
  } else {
    // fallback
    await fetch(`https://www.pushplus.plus/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: option,
        title: contents[0],
        content: contents.join('<br>'),
        template: 'markdown',
      }),
    })
  }
}

const main = async () => {
  await notify(await glados())
}

main()
