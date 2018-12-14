{
  "targets": [
    {
      "target_name": "bucketslib",
      "sources": [
        "<!@(node -p \"require('fs').readdirSync('./csrc').map(f=>'csrc/'+f).join(' ')\")",
      ],
      "include_dirs": [
          "<!(node -e \"require('nan')\")",
          "csrc",
      ],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
          }
        }]
      ]
    }
  ]
}