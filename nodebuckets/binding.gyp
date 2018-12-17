{
  "targets": [
    {
      "target_name": "bucketslib",
      # "type": "<(library)",
      "sources": [
        "<!@(node -p \"require('fs').readdirSync('./csrc').map(f=>'csrc/'+f).join(' ')\")",
        "jstonimbinding.cpp",
        # "csrc/libbuckets.a",
        # "<(module_root_dir)/lib/libbuckets.a",
      ],
      "include_dirs": [
          "<!(node -e \"require('nan')\")",
          # "<(module_root_dir)/csrc",
          "csrc",
      ],
      # "link_settings": {
      #   "libraries": [
      #     "<(module_root_dir)/lib/libbuckets.a",
      #   ],
      # },
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
          }
        }]
      ]
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": ["bucketslib"],
      "copies": [
        {
          "files": ["<(PRODUCT_DIR)/bucketslib.node"],
          "destination": "lib/",
        }
      ]
    }
  ]
}