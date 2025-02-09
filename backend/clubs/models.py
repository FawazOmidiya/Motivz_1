from django.db import models

# Create your models here.
class Club(models.Model):
    name = models.CharField(max_length=255)
    club_id = models.CharField(max_length=255, unique=True)
    address = models.CharField(max_length=255)
    description = models.TextField()
    rating = models.FloatField(default=0.0)

    def __str__(self):
        return self.name
