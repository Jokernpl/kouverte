#!/bin/bash
# serveo.net usa SSH tunnel - è molto affidabile
ssh -R 80:localhost:8082 serveo.net
