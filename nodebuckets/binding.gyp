{
  "targets": [
    {
      "target_name": "bucketslib",
      "sources": [
        "jstonimbinding.cpp",
      ],
      "include_dirs": [
          "<!@(node -p \"require('node-addon-api').include\")",
          "csrc",
          "inc",
      ],
      "conditions": [
        ['OS=="win"',
          {
            'libraries': [
              "<(module_root_dir)/clib/<(OS)/buckets.lib",
            ]
          },
          {
            'libraries': [
              "<(module_root_dir)/clib/<(OS)/libbuckets.a"
            ],
          },
        ]
      ],
      'dependencies': [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      # "link_settings": {
      #   "libraries": [
      #     "<(module_root_dir)/lib/libbuckets.a",
      #   ],
      # },
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
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