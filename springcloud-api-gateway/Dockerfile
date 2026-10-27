FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY . .
RUN mvn -B -pl springcloud-api-gateway -am package -DskipTests
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S care && adduser -S care -G care
WORKDIR /app
COPY --from=build /build/springcloud-api-gateway/target/*.jar app.jar
USER care
ENTRYPOINT ["java","-jar","app.jar"]
