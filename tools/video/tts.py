# Narration with word timings: tts.py <say.json> <outdir>
import asyncio, json, sys, os, inspect
import edge_tts

async def one(i, text, voice, out):
    kw = {}
    if 'boundary' in inspect.signature(edge_tts.Communicate.__init__).parameters:
        kw['boundary'] = 'WordBoundary'
    c = edge_tts.Communicate(text, voice, rate='-3%', **kw)
    words = []
    with open(os.path.join(out, f'a{i}.mp3'), 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] in ('WordBoundary', 'SentenceBoundary'):
                words.append({'type': ch['type'], 't': ch['offset'] / 1e7, 'd': ch['duration'] / 1e7, 'w': ch['text']})
    json.dump(words, open(os.path.join(out, f'w{i}.json'), 'w'))

async def main():
    data = json.load(open(sys.argv[1], encoding='utf-8'))
    for i, s in enumerate(data['scenes']):
        for attempt in range(3):
            try:
                await one(i, s, data['voice'], sys.argv[2]); break
            except Exception as e:
                print('retry', i, e)
        print('tts', i)

asyncio.run(main())
