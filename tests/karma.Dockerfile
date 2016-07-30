FROM markadams/chromium-xvfb-js

RUN npm install -g karma karma-cli karma-jasmine jasmine-core karma-chrome-launcher karma-firefox-launcher

