import sys
import os
import mysql.connector
import cv2
from datetime import datetime, timedelta
import pytz
import random

VIDEO_TABLE = "video_data"
METRIC_TABLE = "metric_data"

# Database connection configuration
config = {
    'user': os.environ.get('DB_USER'),
    'password': os.environ.get('DB_PASSWORD'),
    'host': os.environ.get('DB_HOST'),
    'database': os.environ.get('DB_NAME')
    # 'raise_on_warnings': True
}

cnx, cursor = None, None

# Open a connection to the database
def open_mysql_connection():
    try:
        global cnx, cursor
        cnx = mysql.connector.connect(**config)
        cursor = cnx.cursor()
    except mysql.connector.Error as err:
        print("Error connecting to database: {}".format(err))
        sys.exit(1)

def close_mysql_connection():
    global cnx, cursor
    cursor.close()
    cnx.close()

def table_exists(table_name):
    try:
        global cnx, cursor

        # Check if the table already exists
        exists = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s"
        values = (config['database'], table_name)

        cursor.execute(exists, values)

        result = cursor.fetchone()[0]
        if result == 1:
            print(f"The table '{table_name}' exists.")
            return True
        else:
            print(f"The table '{table_name}' does not exist.")
            return False

    except mysql.connector.Error as err:
        close_mysql_connection()
        print("Error checking if table exists: {}".format(err))
        sys.exit(1)


# Create a table in the database
def create_table(table_name):
    try:
        global cnx, cursor

        # Check if the table already exists
        exists = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s"
        values = (config['database'], table_name)

        cursor.execute(exists, values)

        result = cursor.fetchone()[0]

        if result == 0:
            print(f"The table '{table_name}' does not exist.")

            if(table_name == VIDEO_TABLE):
                create_table_query = f'''
                    CREATE TABLE {table_name} (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        graph_timestamp DATETIME,
                        video_time_seconds INT,
                        video_url TEXT
                    )
                '''
            elif(table_name == METRIC_TABLE):
                create_table_query = f'''
                    CREATE TABLE {table_name} (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        graph_timestamp DATETIME,
                        value INT
                    )
                '''

            # Execute the SQL query
            cursor.execute(create_table_query)
            cnx.commit()
            print("Table created successfully.")

    except mysql.connector.Error as err:
        close_mysql_connection()
        print("Error creating table: {}".format(err))
        sys.exit(1)


def drop_table(table_name):
    try:
        global cnx, cursor

        # Check if the table already exists
        exists = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s"
        values = (config['database'], table_name)

        cursor.execute(exists, values)

        result = cursor.fetchone()[0]
        if result == 1:
            print(f"The table '{table_name}' exists.")
            # Define the SQL query to create the table
            drop_table_query = f'''
                DROP TABLE {table_name}
            '''

            # Execute the SQL query
            cursor.execute(drop_table_query)
            cnx.commit()
            print("Table dropped successfully.")

    except mysql.connector.Error as err:
        close_mysql_connection()
        print("Error dropping table: {}".format(err))
        sys.exit(1)




# Insert values into the table
def insert_values(table_name, graph_timestamp, value, video_url=None):
    try:

        global cnx, cursor

        if(table_name == VIDEO_TABLE):
            insert_query = f'''
                INSERT INTO {table_name} (graph_timestamp, video_time_seconds, video_url)
                VALUES (%s, %s, %s)
            '''
            values = (graph_timestamp, value, video_url)
        elif(table_name == METRIC_TABLE):
            insert_query = f'''
                INSERT INTO {table_name} (graph_timestamp, value)
                VALUES (%s, %s)
            '''
            values = (graph_timestamp, value)

        # Execute the SQL query
        cursor.execute(insert_query, values)
        cnx.commit()
        print("Values inserted successfully.")

    except mysql.connector.Error as err:
        close_mysql_connection()
        print("Error inserting values: {}".format(err))
        sys.exit(1)


def get_video_duration(url):
    video = cv2.VideoCapture(url)
    fps = video.get(cv2.CAP_PROP_FPS)
    frame_count = video.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = frame_count / fps

    video.release()

    # Truncate the duration to an integer value
    return int(duration)


# Call the function to open a connection
open_mysql_connection()

if table_exists(VIDEO_TABLE):
    drop_table(VIDEO_TABLE)

if table_exists(METRIC_TABLE):
    drop_table(METRIC_TABLE)

# Call the function to create the table
create_table(VIDEO_TABLE)
create_table(METRIC_TABLE)

# Get values from command-line arguments
videos_url = os.environ.get('VIDEOS_URL')
videos_url = videos_url.split(',')
timezone = pytz.timezone("Europe/Madrid")
start_date = datetime.now(timezone)
graph_timestamp = start_date

for url in videos_url:
    video_duration = get_video_duration(url)
    for second in range(video_duration):
        graph_timestamp += timedelta(seconds=1)
        insert_values(VIDEO_TABLE, graph_timestamp, second, url)
        insert_values(METRIC_TABLE, graph_timestamp, random.randint(0, 100))

# Call the function to close the connection
close_mysql_connection()

sys.exit(0)
