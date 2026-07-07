# Usamos el SDK de .NET 10 para compilar
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar el archivo del proyecto .csproj y restaurar dependencias
COPY ["backend.csproj", "./"]
RUN dotnet restore "backend.csproj"

# Copiar el resto del código y compilarlo en la carpeta /app/build
COPY . .
RUN dotnet build "backend.csproj" -c Release -o /app/build

# Publicar la aplicación optimizada
FROM build AS publish
RUN dotnet publish "backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Crear la imagen final de producción usando el entorno de ejecución de .NET 10
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Render expone de forma dinámica el puerto 10000
ENV ASPNETCORE_URLS=http://+:10000

ENTRYPOINT ["dotnet", "backend.dll"]