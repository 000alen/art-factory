target = int(input())
current = int(input())

if current <= target:
    x = target - current # subimos
    y = 100 - target + current # bajamos
    if x < y:
        print(f"{x} veces arriba")
    else:
        print(f"{y} veces abajo")
else:
    x = current - target
    y = 100 - current + target
    if x < y:
        print(f"{x} veces abajo")
    else:
        print(f"{y} veces arriba")