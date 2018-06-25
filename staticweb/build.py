#!/usr/bin/env python

import os
import io
import shutil
import click

from babel import Locale, support
from jinja2 import Environment, FileSystemLoader

CATALOGS = {}

def list_locales(translation_dir):
    # copied largely from https://github.com/python-babel/flask-babel/blob/master/flask_babel/__init__.py
    locales = []
    for root, _, files in os.walk(translation_dir):
        for f in files:
            fp = os.path.join(root, f)
            if fp.endswith('.mo'):
                locale_name = os.path.basename(os.path.dirname(os.path.dirname(fp)))
                locales.append(Locale.parse(locale_name))
    return locales

def renderFile(template_root, template_name, translation_dir, locale, config):
    if locale.language not in CATALOGS:
        CATALOGS[locale.language] = support.Translations.load(translation_dir, [locale.language])
    
    catalog = CATALOGS[locale.language]

    env = Environment(loader=FileSystemLoader(template_root))
    env.add_extension('jinja2.ext.i18n')
    locales = list_locales(translation_dir)
    params = {
        'gettext': catalog.ugettext,
        'all_locales': locales,
        'lang': '/{0}'.format(locale.language),
        'this_url': template_name,
        'config': config,
        'latest_version': 'v0.55',
        'current_locale': locale,
    }
    tmpl = env.get_template(template_name)
    try:
        return tmpl.render(**params)
    except Exception as e:
        print 'Error rendering template', template_name
        raise e

@click.command()
@click.option('-i', '--input-dir',
    default='src',
    help='Root directory of site source files')
@click.option('-t', '--translations',
    default='translations',
    help='Directory containing translations')
@click.option('--stripe-public-key', envvar='STRIPE_PUBLIC_KEY')
@click.option('-o', '--output-dir',
    default='_site')
def build(input_dir, output_dir, translations, stripe_public_key):
    print 'building', input_dir, 'to', output_dir
    for root, dirs, files in os.walk(input_dir):
        for d in list(dirs):
            if d.startswith('_'):
                dirs.remove(d)
        for f in files:
            fp = os.path.join(root, f)
            relpath = os.path.relpath(fp, input_dir)
            dstpath = os.path.join(output_dir, relpath)
            if f.startswith('_') or f.startswith('.'):
                # skip it
                continue
            if fp.endswith('.html'):
                # render it
                print 'RENDERING', fp
                locales = list_locales(translations)
                for locale in locales:
                    dstpath = os.path.join(output_dir, locale.language, relpath)
                    print '->', dstpath
                    try:
                        os.makedirs(os.path.dirname(dstpath))
                    except:
                        pass
                    rendered = renderFile(
                        template_root=input_dir,
                        template_name=relpath,
                        translation_dir=translations,
                        locale=locale,
                        config={
                            'STRIPE_PUBLIC_KEY': stripe_public_key,
                        })
                    with io.open(dstpath, 'w', encoding='utf8') as fh:
                        fh.write(rendered)
            else:
                # copy it
                try:
                    os.makedirs(os.path.dirname(dstpath))
                except:
                    pass
                shutil.copy2(fp, dstpath)
            

if __name__ == '__main__':
    build()
