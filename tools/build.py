#!/usr/bin/env python3
"""Génère le site (dossier _site) à partir de data/site.json et template/index.html.
Toute valeur est validée puis échappée : en cas d'erreur le build échoue et l'ancien site reste en ligne."""
import json, re, shutil, sys
from html import escape as e
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'
BASE = 'https://yusuma.github.io/Bryan-Laurier--UX-UI-Webdesigner---2026/'
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
URL = re.compile(r'^https://[^\s"<>\\]+$')
FILE = re.compile(r'^[\w@./-]{1,100}$')
SLUG = re.compile(r'^[a-z0-9-]{1,60}$')
SKIP = {'.git', '.github', 'tools', 'template', 'data', '_site', 'README.md', '.gitattributes'}

def fail(msg):
    sys.exit('ERREUR data/site.json : ' + msg)

def need(cond, msg):
    if not cond: fail(msg)

def text(v, label, n=400):
    need(isinstance(v, str) and len(v) <= n, f'{label} doit être un texte de {n} caractères maximum')
    return v

def validate(d):
    for k, v in d['colors'].items(): need(HEX.match(v), f'couleur {k} invalide ({v})')
    need(URL.match(d['behance']), 'lien Behance invalide (https:// obligatoire)')
    for f in ('cv', 'portfolio'): need(FILE.match(d['bio'][f]), f'fichier {f} invalide')
    for s in d['socials']: need(URL.match(s['url']) and re.match(r'^\w{1,4}$', s['label']), f"réseau {s['name']} invalide")
    for p in d['projects']:
        need(SLUG.match(p['slug']), f"identifiant de projet invalide ({p['slug']})")
        need(set(p['devices']) <= {'desktop', 'mobile'}, f"appareils invalides pour {p['slug']}")
        a = p['action']
        need(a['type'] in ('link', 'unavailable', 'epilepsy'), f"action invalide pour {p['slug']}")
        if a['type'] != 'unavailable': need(URL.match(a['url']), f"lien invalide pour {p['slug']} (https:// obligatoire)")
    for part in ('formations', 'experiences'):
        for i in d[part]:
            for k in ('title', 'desc', 'dates'): text(i[k], k, 600)

def head(d):
    m, c = d['meta'], d['colors']
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'Person', 'name': 'Bryan Laurier', 'jobTitle': m['jobTitle'],
                     'url': BASE, 'sameAs': [s['url'] for s in d['socials']]}, ensure_ascii=False).replace('<', '\\u003c')
    t, desc = e(m['title']), e(m['description'])
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="{c['dark']}" id="themeColor" data-dark="{c['dark']}" data-light="{c['light']}">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:title" content="{t}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}"><meta property="og:image" content="{BASE}%40RESSOURCES/og-image.png"><meta property="og:image:alt" content="Bryan Laurier, {e(m['jobTitle'])}"><meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{BASE}">
<link rel="icon" href="@RESSOURCES/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="@RESSOURCES/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="@CSS/theme.css">
<link rel="stylesheet" href="@CSS/style.css">
<script type="application/ld+json">{ld}</script>
</head>'''

def items(lst):
    return '      <div class="work-list">\n' + ''.join(
        f'        <div class="work-item">\n          <h3>{e(i["title"])}</h3>\n          <span class="desc">{e(i["desc"])}</span>\n          <span class="status">{e(i["dates"])}</span>\n        </div>\n' for i in lst) + '      </div>'

def card(p):
    a, dev = p['action'], f' data-devices="{" ".join(p["devices"])}"' if p['devices'] else ''
    if a['type'] == 'link': act = f'<a class="go" href="{e(a["url"])}" target="_blank" rel="noopener noreferrer">{e(a["label"])}</a>'
    elif a['type'] == 'epilepsy': act = f'<button class="go" type="button" data-epilepsy-url="{e(a["url"])}">{e(a["label"])}</button>'
    else: act = '<button class="go" type="button" data-unavailable>Indisponible</button>'
    t = e(p['title'])
    return (f'<li class="card"{dev}><div class="card-visual"><span class="card-fallback" aria-hidden="true">{t}</span>'
            f'<img src="@RESSOURCES/travaux/{p["slug"]}.webp" alt="{e(p["alt"])}" width="1200" height="900" loading="lazy" onerror="this.hidden=true"></div>'
            f'<div class="card-info"><h3>{t}</h3><p class="desc">{e(p["desc"])}</p><span class="status">{e(p["status"])}</span>{act}</div></li>\n')

def render(d):
    c = d['contact']; b = d['bio']
    rows = ''.join(f'  <div class="row {"left" if i % 2 == 0 else "right"}"><div class="row-track"><span>{e(r)}</span><span>·</span></div></div>\n'
                   for i, r in enumerate(d['hero']['rows']))
    skills = ''.join(f'<span>{e(s)}</span>' for s in b['skills'])
    rep = {
      'NAVMAIL': f'<a class="info-btn" href="#contact" data-mail data-keep data-u="{e(c["email_user"])}" data-d="{e(c["email_domain"])}">Contact</a>',
      'H1': f'<h1 class="sr-only">{e(d["hero"]["h1"])}</h1>',
      'ROWS': rows.rstrip('\n'),
      'HINT': e(d['hero']['hint']),
      'BIO': ''.join(f'      <p>{e(p)}</p>\n' for p in b['paragraphs']) + f'      <div class="skills-row">{skills}</div>\n      <p class="langs">{e(b["languages"])}</p>\n'
             f'      <div class="cta-row">\n        <a href="{e(b["cv"])}" target="_blank" rel="noopener noreferrer" class="filled">Télécharger CV</a>\n'
             f'        <a href="{e(b["portfolio"])}" target="_blank" rel="noopener noreferrer">Télécharger portfolio</a>\n      </div>',
      'FORMATIONS': items(d['formations']), 'EXPERIENCES': items(d['experiences']),
      'GALLERY': '      <ul class="gallery">\n' + ''.join(card(p) for p in d['projects']) + f'</ul>\n      <a class="behance-more" href="{e(d["behance"])}" target="_blank" rel="noopener noreferrer">Plus de projets sur Behance</a>',
      'CONTACT': f'      <div class="contact-row">\n        <a href="#contact" data-mail data-u="{e(c["email_user"])}" data-d="{e(c["email_domain"])}">{e(c["email_user"])} [at] {e(c["email_domain"])}</a>\n'
                 f'        <a href="#contact" data-tel data-a="{e(c["phone_a"])}" data-b="{e(c["phone_b"])}">Téléphone sur demande</a>\n        <div class="socials">\n'
                 + ''.join(f'          <a href="{e(s["url"])}" target="_blank" rel="noopener noreferrer" aria-label="{e(s["name"])}">{e(s["label"])}</a>\n' for s in d['socials'])
                 + '        </div>\n      </div>',
      'BEHANCE': e(d['behance']),
    }
    page = (ROOT / 'template/index.html').read_text(encoding='utf8').replace('{{HEAD}}', head(d))
    for k, v in rep.items(): page = page.replace('{{' + k + '}}', v)
    left = re.findall(r'\{\{\w+\}\}', page)
    need(not left, f'repères non remplacés : {left}')
    return page

def theme(c):
    return f":root{{--c-dark:{c['dark']};--c-light:{c['light']};--c-mid:{c['mid']};--c-accent:{c['accent']};}}\n"

def main():
    d = json.loads((ROOT / 'data/site.json').read_text(encoding='utf8'))
    try: validate(d)
    except (KeyError, TypeError) as err: fail(f'champ manquant ou mal formé ({err})')
    if OUT.exists(): shutil.rmtree(OUT)
    shutil.copytree(ROOT, OUT, ignore=lambda dr, names: [n for n in names if n in SKIP] if Path(dr) == ROOT else [])
    (OUT / 'index.html').write_text(render(d), encoding='utf8')
    (OUT / '@CSS/theme.css').write_text(theme(d['colors']), encoding='utf8')
    (ROOT / '@CSS/theme.css').write_text(theme(d['colors']), encoding='utf8')
    print('Site généré dans', OUT)

if __name__ == '__main__': main()
