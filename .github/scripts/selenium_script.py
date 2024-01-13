from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time

def main():
    # Set up Chrome options
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless')  # You can remove this line if you want to see the browser in action

    # Initialize the Chrome driver
    driver = webdriver.Chrome(options=chrome_options)

    try:
        # Open SoundCloud
        driver.get("https://soundcloud.com")

        # Wait for the page to load (adjust sleep time as needed)
        time.sleep(10)

        # Example: Use querySelector to get data
        element = driver.find_element_by_css_selector('.playbackSoundBadge__titleLink')
        data = element.text
        print(f"Extracted data: {data}")

    finally:
        # Close the browser window
        driver.quit()

if __name__ == "__main__":
    main()
