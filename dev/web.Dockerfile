FROM python:2.7.11
MAINTAINER matt

ADD requirements.txt /requirements.txt
RUN pip install -r /requirements.txt
