import sys
import urllib2

print "Requesting " + sys.argv[1]
response = urllib2.urlopen( sys.argv[1] )
print "Response: \n"
print response

