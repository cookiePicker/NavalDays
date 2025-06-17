from flask import Flask, render_template

app = Flask(__name__)

# Home route - this is where the main logic happens
@app.route('/')
def home():
    # Python logic to generate dynamic content
    title = "Healthy Lifestyle"
    message = "Welcome to the Healthy Lifestyle Project"
    authors = ["Timo", "Alba", "Hugo", "Alejandro"]
    
    # Image filename to display
    image_filename = 'images/prj_img.png'
    image_filename2 = 'images/negr.jpeg'

    # Render the HTML file with variables passed from Python
    return render_template('index.html', title=title, message=message, authors=authors, image_filename=image_filename,image_filename2 = image_filename2)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)  # Makes it accessible in the local network
