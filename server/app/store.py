import os
import pandas as pd

DATA_DIR = "data"


class DataStore:

  def __init__(self):
    act_path = os.path.join(DATA_DIR, "actuals.csv")
    fc_path = os.path.join(DATA_DIR, "forecasts.csv")

    if os.path.exists(act_path):
      self.actuals = pd.read_csv(act_path, parse_dates=["startTime"])
    else:
      self.actuals = pd.DataFrame(columns=["startTime", "generation"])

    if os.path.exists(fc_path):
      self.forecasts = pd.read_csv(
          fc_path, parse_dates=["startTime", "publishTime"]
      )
    else:
      self.forecasts = pd.DataFrame(
          columns=["startTime", "publishTime", "generation"]
      )


# This line creates the 'store' instance that app/main.py imports
store = DataStore()