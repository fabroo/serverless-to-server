import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import numpy as np
from numpy.random import uniform
import csv
import numpy
import matplotlib.pyplot as plt
from tensorflow.keras.utils import to_categorical
from keras.optimizers import Adam
from keras.models import Sequential
from keras.layers import Dense, Dropout, LeakyReLU
import random


BATCH = 16
SAMPLE_LEN = 19       # number N of points where a curve is sampled
SAMPLE_SIZE = 919   # number of curves in the training set

reader = csv.reader(open("functions/assets/dataset.csv", encoding="utf8"), delimiter=",")
next(reader)
x = list(reader)
SAMPLE = numpy.array(x).astype("float")

y_cat = np.array([[]])

for sample in to_categorical(SAMPLE):
    y_cat = np.append(y_cat, sample.flatten())

#####
LEAKY_RELU = LeakyReLU(0.2)
generator = Sequential()
generator.add(Dense(SAMPLE_LEN))
generator.add(LEAKY_RELU)
generator.add(Dense(512))
generator.add(LEAKY_RELU)
generator.add(Dense(SAMPLE_LEN))
opt = Adam(learning_rate=1)
generator.compile(optimizer = opt, loss = "mse", metrics = ["accuracy"])


#####
DROPOUT = Dropout(0.2)
discriminator = Sequential()
discriminator.add(Dense(SAMPLE_LEN, activation="relu"))
discriminator.add(DROPOUT)
discriminator.add(Dense(SAMPLE_LEN, activation="relu"))
discriminator.add(DROPOUT)
discriminator.add(Dense(1, activation = "sigmoid"))
discriminator.compile(optimizer = "adam", loss = "binary_crossentropy", metrics = ["accuracy"])


#####
gan = Sequential()
gan.add(generator)
gan.add(discriminator)
gan.compile(optimizer = "adam", loss = "binary_crossentropy", metrics = ["accuracy"])

#####
EPOCHS = 64
NOISE = (np.random.rand(SAMPLE_SIZE, 19) * 4).astype(int)
ONES = np.ones((SAMPLE_SIZE))
ZEROS = np.zeros((SAMPLE_SIZE))
print("epoch | dis. loss | dis. acc | gen. loss | gen. acc")
print("------+-----------+----------+-----------+----------")

for e in range(EPOCHS):
    for k in range(SAMPLE_SIZE//BATCH):
        n = np.random.randint(0, SAMPLE_SIZE, size = BATCH)
        p = generator.predict(NOISE[n])
        x = np.concatenate((SAMPLE[n], p))
        y = np.concatenate((ONES[n], ZEROS[n]))
        d_result = discriminator.train_on_batch(x, y)
        discriminator.trainable = False
        g_result = gan.train_on_batch(NOISE[n], ONES[n])
        discriminator.trainable = True
    print(f" {e:04n} |  {d_result[0]:.5f}  |  {d_result[1]:.5f} |  {g_result[0]:.5f}  |  {g_result[1]:.5f}")


y = generator.predict(np.array([NOISE[0]])).astype(int)[0]
print(y)