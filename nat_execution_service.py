#!/usr/bin/env python3
"""
NAT Execution Service
Simple HTTP service that executes NAT agent commands and returns results
Runs on host to provide Docker CLI access for backend container
"""

import subprocess
import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NATExecutionHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logger.info(format % args)
    
    def do_POST(self):
        try:
            # Parse request
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            input_text = request_data.get('input', 'Hello from OpenSOC')
            timeout = request_data.get('timeout', 90)
            
            # Execute NAT agent command
            cmd = [
                'docker', 'compose', 'exec', '-T', 'nvidia-nat', 
                'timeout', str(timeout), 'nat', 'run',
                '--config_file', 'my-agents/open-soc/src/open_soc/configs/config.yml',
                '--input', input_text
            ]
            
            logger.info(f"Executing NAT command with input: {input_text}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout + 10,
                cwd='/docker/open-soc'
            )
            
            # Parse response
            response = {
                'success': result.returncode == 0,
                'stdout': result.stdout.strip(),
                'stderr': result.stderr.strip(),
                'returncode': result.returncode
            }
            
            # Send JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))
            
            logger.info(f"NAT execution completed: success={response['success']}")
            
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
        except subprocess.TimeoutExpired:
            self.send_error(504, "NAT agent execution timeout")
        except Exception as e:
            logger.error(f"NAT execution error: {str(e)}")
            self.send_error(500, f"NAT execution failed: {str(e)}")
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy', 'service': 'NAT Execution Service'}).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

def run_service(port=9902):
    server = HTTPServer(('0.0.0.0', port), NATExecutionHandler)
    logger.info(f"Starting NAT Execution Service on port {port}")
    logger.info(f"Health endpoint: http://localhost:{port}/health")
    logger.info(f"Execution endpoint: POST http://localhost:{port}/")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down NAT Execution Service")
        server.shutdown()

if __name__ == '__main__':
    port = 9902
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run_service(port)