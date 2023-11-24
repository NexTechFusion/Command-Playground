import sys
import interpreter
import openai

api_key = sys.argv[1]
question = sys.argv[2]

interpreter.model = 'gpt-3.5-turbo'
interpreter.auto_run = True
openai.api_key=api_key
interpreter.chat(question)
interpreter.chat()
