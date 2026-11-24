import zipfile

with zipfile.ZipFile(r"d:\bombaii thefts\PiSecOps_Mumbai_3D_Map_Prototype.zip") as z:
    z.extractall(r"d:\bombaii thefts\extracted_prototype")
print("Extracted successfully!")
