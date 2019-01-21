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
          "<!@(node -p \"require('node-addon-api').include\")",
          # "<(module_root_dir)/csrc",
          "csrc",
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