#!/bin/bash
ssh -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=/dev/null" -o "ServerAliveInterval=30" -R 80:localhost:8082 nokey@localhost.run
