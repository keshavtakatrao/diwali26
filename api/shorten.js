export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    return response.status(204).end()
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const link = typeof request.body?.url === 'string' ? request.body.url : ''
  let destination
  try {
    destination = new URL(link)
  } catch {
    return response.status(400).json({ error: 'Invalid URL' })
  }

  if (!['http:', 'https:'].includes(destination.protocol)) {
    return response.status(400).json({ error: 'Invalid URL protocol' })
  }

  try {
    const endpoint = new URL('https://is.gd/create.php')
    endpoint.searchParams.set('format', 'simple')
    endpoint.searchParams.set('url', destination.href)

    const shortenerResponse = await fetch(endpoint)
    if (!shortenerResponse.ok) {
      return response.status(502).json({ error: 'URL shortener unavailable' })
    }

    const shortened = (await shortenerResponse.text()).trim()
    const shortenedUrl = new URL(shortened)
    if (shortenedUrl.protocol !== 'https:' || shortenedUrl.hostname !== 'is.gd') {
      return response.status(502).json({ error: 'Invalid short URL returned' })
    }

    return response.status(200).json({ url: shortenedUrl.href })
  } catch {
    return response.status(502).json({ error: 'URL shortener unavailable' })
  }
}
