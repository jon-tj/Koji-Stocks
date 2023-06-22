a = 5
codeObject = compile("global a; a=10", 'code_string', 'exec')
exec(codeObject)
print(a)