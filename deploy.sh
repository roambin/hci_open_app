#!/bin/bash
PACKAGE='sport_go.tar'
SERVER_PATH='/usr/tomcat/apache-tomcat-8.5.51/webapps/'$PACKAGE
tar -cf $PACKAGE sport_go
scp $PACKAGE root@47.99.44.124:$SERVER_PATH
rm -f $PACKAGE
ssh root@47.99.44.124 "cd /usr/tomcat/apache-tomcat-8.5.51/webapps/;tar -xf sport_go.tar;rm -f sport_go.tar"
