import numpy as np
import pandas as pd
import tensorflow as tf
import os
import pickle

# gcloud functions deploy test_model  --runtime python37 --trigger-http --allow-unauthenticated --verbosity=debug --memory 2048

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

def test_model(request):
    response = {}
    try:
        __location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

        model = tf.keras.models.load_model(os.path.join(__location__, 'modelo.h5'))
        answers = request.get_json()["answers"]

        points = list(answers.values())
        questions = list(answers.keys())

        array = np.array([points])
        index_values = ['answers']
        column_values = [questions]

        df = pd.DataFrame(data=array, index=index_values, columns=column_values)

        predictions = model.predict(df)

        response = {
            "state": False,
            "payload": {
                "prediction": predictions
            },
            "err": {}
        }

        return str(response)

    except Exception as e:
        response = {
            "state": True,
            "payload": {},
            "err": {
                "msg": e
            }
        }
        return str(response)