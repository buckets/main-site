#!/usr/bin/env python

import os
import io
import shutil
import click
# import babel

from jinja2 import Environment, FileSystemLoader


def renderFile(template_root, template_name, config):
    env = Environment(loader=FileSystemLoader(template_root))
    env.add_extension('jinja2.ext.i18n')
    # langs = [x.language for x in babel.list_translations()]
    def gettext(s):
        print 'gettext', s
        return s
    params = {
        'gettext': gettext,
        'all_locales': [
            {'language': 'en', 'display_name': 'English'}
        ],
        'config': config,
        'latest_version': 'v0.55',
    }
    params['current_locale'] = params['all_locales'][0]
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
        print root, dirs, files
        for d in list(dirs):
            if d.startswith('_'):
                dirs.remove(d)
        for f in files:
            fp = os.path.join(root, f)
            relpath = os.path.relpath(fp, input_dir)
            dstpath = os.path.join(output_dir, relpath)
            if f.startswith('_'):
                # skip it
                continue
            try:
                os.makedirs(os.path.dirname(dstpath))
            except:
                pass
            if fp.endswith('.html'):
                # render it
                print 'RENDER', fp, dstpath
                rendered = renderFile(
                    template_root=input_dir,
                    template_name=relpath,
                    config={
                        'STRIPE_PUBLIC_KEY': stripe_public_key,
                    })
                with io.open(dstpath, 'w', encoding='utf8') as fh:
                    fh.write(rendered)
            else:
                # copy it
                shutil.copy2(fp, dstpath)
            

if __name__ == '__main__':
    build()
