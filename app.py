from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/lobby')
def lobby():
    return render_template('index.html')  # You can change this to 'lobby.html' if needed

@app.route('/room.html')
def room():
    room_id = request.args.get('room')
    return render_template('room.html', room_id=room_id)

if __name__ == '__main__':
    app.run(debug=True)
