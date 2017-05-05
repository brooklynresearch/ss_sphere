import sys

filename = sys.argv[1]
old = sys.argv[2]
new = sys.argv[3]

srcText = None
with open(filename,'r') as f:
    print "[+]\tReading file " + filename
    srcText = f.read()

print "[+]\tReplacing " + old + " with " + new
newText = srcText.replace(old, new)

with open(filename + '.OLD', 'w') as f:
    print "[+]\tSaving original as " + filename + '.OLD'
    f.write(srcText)

with open(filename,'w') as f:
    print "[+]\tSaving changes"
    f.write(newText)
