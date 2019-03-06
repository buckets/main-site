{
  "targets": [
    {
      "target_name": "bucketslib",
      "sources": [
        "jstonimbinding.cpp",
      ],
      "include_dirs": [
          "<!@(node -p \"require('node-addon-api').include\")",
          "<(module_root_dir)/inc",
      ],
      "conditions": [
        [
          'OS=="win" and target_arch == "ia32"',
          {
            "sources": [
              "<!@(node -p \"require('fs').readdirSync('./csrc32').map(f=>'csrc32/'+f).join(' ')\")",
            ],
            # "link_settings": {
            #   'libraries': [
            #     "<(module_root_dir)/clib/<(OS)/buckets32.dll"
            #   ],
            # },
            "include_dirs": [
              "<(module_root_dir)/csrc32",
            ],
            'cflags_cc': [ "-fPIC" ],
          },
          'OS=="win" and target_arch == "x64"',
          {
            "sources": [
              "<!@(node -p \"require('fs').readdirSync('./csrc64').map(f=>'csrc64/'+f).join(' ')\")",
            ],
            # "link_settings": {
            #   'libraries': [
            #     "<(module_root_dir)/clib/<(OS)/buckets64.dll"
            #   ],
            # },
            "include_dirs": [
              "<(module_root_dir)/csrc64",
            ],
            'cflags_cc': [ "-fPIC" ],
          },
          # {
          #   "sources": [
          #     "<!@(node -p \"require('fs').readdirSync('./csrc64').map(f=>'csrc64/'+f).join(' ')\")",
          #   ],
          #   "include_dirs": [
          #     "<(module_root_dir)/csrc64",
          #   ],
            
          # },
          # 'OS=="linux"',
          # {
          #   "link_settings": {
          #     'libraries': [
          #       "<(module_root_dir)/clib/<(OS)/libbuckets.a"
          #       "libpthread",
          #     ],
          #   },
          #   "include_dirs": [
          #     "<(module_root_dir)/csrc",
          #   ],
          # },
          {
            "link_settings": {
              'libraries': [
                "<(module_root_dir)/clib/<(OS)/libbuckets.a"
              ],
            },
            "include_dirs": [
              "<(module_root_dir)/csrc",
            ],
          },
        ]
      ],
      'dependencies': [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      "msbuild_settings": {
        "Link": {
          "ImageHasSafeExceptionHandlers": "false"
        }
      },
      # 'configurations': {
      #   'Debug': {
      #     'defines': [ 'DEBUG', '_DEBUG' ],
      #     'msvs_settings': {
      #       'VCCLCompilerTool': {
      #         'RuntimeLibrary': 1, # static debug
      #       },
      #     },
      #   },
      #   'Release': {
      #     'defines': [ 'NDEBUG' ],
      #     'msvs_settings': {
      #       'VCCLCompilerTool': {
      #         'RuntimeLibrary': 0, # static release
      #       },
      #     },
      #   }
      # },
      # "conditions": [
      #   ['OS=="win"',
      #     {
      #       'cflags': [ "-m32" ],
      #       'ldflags': [ "-m elf_i386" ],
      #       'cflags_cc': [ "-fPIC -m32" ],
      #     },
      #   ]
      # ],
      # 'msvs_settings': {
      #   'VCCLCompilerTool': {
      #     'ExceptionHandling': 1,
      #     'RuntimeLibrary': 0,
      #     'AdditionalOptions': [
      #     #   # '/GR',
      #       '/MT',
            
      #     #   # '/EHsc'
      #     ]
      #    },
      #   # "VCLinkerTool": {
      #   #   "LinkIncremental": 1,
      #   #   "AdditionalLibraryDirectories": [
      #   #     "<(module_root_dir)\\clib\\<(OS)",
      #   #     "<(module_root_dir)\\csrc",
      #   #     "<(module_root_dir)\\inc",
      #   #   ]
      #   # }
      # },
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": ["bucketslib"],
      "copies": [
        {
          "files": ["<(PRODUCT_DIR)/bucketslib.node"],
          "destination": "<(module_root_dir)/lib/<(target_arch)/",
        }
      ]
    }
  ]
}