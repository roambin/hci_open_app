#!/bin/bash
PACKAGE='hci_open_app.tar'
SERVER_PATH='/usr/tomcat/apache-tomcat-8.5.51/webapps/'$PACKAGE
tar -cf $PACKAGE hci_open_app
scp $PACKAGE root@47.99.44.124:$SERVER_PATH
rm -f $PACKAGE
ssh root@47.99.44.124 "cd /usr/tomcat/apache-tomcat-8.5.51/webapps/;tar -xf hci_open_app.tar;rm -f hci_open_app.tar"
